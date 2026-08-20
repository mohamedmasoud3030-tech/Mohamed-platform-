#!/usr/bin/env bash
# Least-privilege verification against a real server, a real database and real sessions.
set -u
API="http://127.0.0.1:8080/api/trpc"
ADMIN="kimi_sid=$(cat /tmp/admin.jwt)"
USER="kimi_sid=$(cat /tmp/user.jwt)"
pass=0; fail=0

# A test fixture that has quietly expired produces UNAUTHORIZED everywhere and
# looks exactly like a catastrophic authorization regression. Fail loudly instead.
for token in /tmp/admin.jwt /tmp/user.jwt; do
  if ! python3 - "$token" <<'CHECK'
import base64, json, sys, time
raw = open(sys.argv[1]).read().split(".")[1]
payload = json.loads(base64.urlsafe_b64decode(raw + "==" * (-len(raw) % 4)))
sys.exit(0 if payload["exp"] > time.time() + 60 else 1)
CHECK
  then
    echo "FIXTURE EXPIRED: $token — re-run 'node e2e/seed.mjs' before this suite." >&2
    exit 2
  fi
done

code() { # code <cookie|-> <method> <procedure> [json]
  local cookie="$1" method="$2" proc="$3" body="${4:-}"
  local args=(-s -o /tmp/resp.json -w '%{http_code}')
  [ "$cookie" != "-" ] && args+=(-H "cookie: $cookie")
  if [ "$method" = "POST" ]; then args+=(-X POST -H 'content-type: application/json' -d "$body"); fi
  curl "${args[@]}" "$API/$proc"
}
err() { python3 -c "import json;d=json.load(open('/tmp/resp.json'));print(d.get('error',{}).get('json',{}).get('data',{}).get('code','OK'))" 2>/dev/null || echo PARSE_ERR; }
expect() { # expect <label> <expected> <actual>
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1)); else echo "  FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}

echo ""
echo "== an anonymous visitor reaches nothing privileged =="
for p in inquiries.list inquiries.countNew operations.capabilities operations.auditTrail projects.list content.list; do
  code - GET "$p" >/dev/null; expect "anonymous $p" "UNAUTHORIZED" "$(err)"
done
code - POST operations.purgeInquiry '{"json":{"id":1,"confirmId":1,"reason":"trying to delete"}}' >/dev/null
expect "anonymous purge is refused" "UNAUTHORIZED" "$(err)"
code - POST operations.revealInquiryContact '{"json":{"id":1,"reason":"give me the email"}}' >/dev/null
expect "anonymous reveal is refused" "UNAUTHORIZED" "$(err)"
code - POST operations.exportInquiries '{"json":{"reason":"harvest the list"}}' >/dev/null
expect "anonymous export is refused" "UNAUTHORIZED" "$(err)"

echo ""
echo "== a signed-in NON-admin reaches nothing privileged =="
for p in inquiries.list inquiries.countNew operations.capabilities operations.auditTrail projects.list; do
  code "$USER" GET "$p" >/dev/null; expect "role=user $p" "FORBIDDEN" "$(err)"
done
code "$USER" POST operations.revealInquiryContact '{"json":{"id":1,"reason":"I want the contact details"}}' >/dev/null
expect "role=user reveal is refused" "FORBIDDEN" "$(err)"
code "$USER" POST operations.purgeInquiry '{"json":{"id":1,"confirmId":1,"reason":"destroy the record"}}' >/dev/null
expect "role=user purge is refused" "FORBIDDEN" "$(err)"
code "$USER" POST inquiries.updateStatus '{"json":{"id":1,"status":"closed"}}' >/dev/null
expect "role=user cannot change status" "FORBIDDEN" "$(err)"

echo ""
echo "== the public surface still works for everyone =="
code - GET ping >/dev/null; expect "anonymous ping" "OK" "$(err)"
code - GET projects.listPublished >/dev/null; expect "anonymous published projects" "OK" "$(err)"

echo ""
echo "== admin sees the list, but contact details are masked =="
code "$ADMIN" GET inquiries.list >/dev/null; expect "admin can list" "OK" "$(err)"
python3 - <<'PY'
import json
rows = json.load(open('/tmp/resp.json'))['result']['data']['json']
leak = [r for r in rows if (r.get('email') and '@example.com' in str(r['email']) and '•' not in str(r['email']))
        or (r.get('phone') and '•' not in str(r['phone']))]
print(f"  {'PASS' if not leak else 'FAIL'}  no full contact detail appears in the list")
print(f"  {'PASS' if all('•' in str(r['email']) for r in rows if r['hasEmail']) else 'FAIL'}  masked emails are still recognisable")
for r in rows[:2]:
    print(f"        #{r['id']} {r['name']} -> email={r['email']} phone={r['phone']}")
PY

echo ""
echo "== revealing contact details demands a real reason =="
code "$ADMIN" POST operations.revealInquiryContact '{"json":{"id":1,"reason":"why"}}' >/dev/null
expect "a token reason is rejected" "BAD_REQUEST" "$(err)"
code "$ADMIN" POST operations.revealInquiryContact '{"json":{"id":1,"reason":"Replying to the inquiry by email today"}}' >/dev/null
expect "a real reason is accepted" "OK" "$(err)"
python3 -c "
import json;d=json.load(open('/tmp/resp.json'))['result']['data']['json']
print(f\"  {'PASS' if d['email']=='sara.alharthi@example.com' else 'FAIL'}  the full address is returned only on reveal\")"

echo ""
echo "== permanent deletion cannot happen by accident =="
code "$ADMIN" POST operations.purgeInquiry '{"json":{"id":2,"confirmId":1,"reason":"Client asked for removal"}}' >/dev/null
expect "mismatched confirmation is refused" "BAD_REQUEST" "$(err)"
code "$ADMIN" POST operations.purgeInquiry '{"json":{"id":2,"confirmId":2,"reason":"short"}}' >/dev/null
expect "a too-short reason is refused" "BAD_REQUEST" "$(err)"
code "$ADMIN" POST operations.purgeInquiry '{"json":{"id":2,"confirmId":2,"reason":"Client asked in writing for removal"}}' >/dev/null
expect "correct confirmation and reason succeeds" "OK" "$(err)"
code "$ADMIN" POST operations.purgeInquiry '{"json":{"id":2,"confirmId":2,"reason":"Client asked in writing for removal"}}' >/dev/null
expect "repeating the deletion is idempotent, not an error" "OK" "$(err)"

echo ""
echo "== archive is reversible and idempotent =="
code "$ADMIN" POST operations.archiveInquiry '{"json":{"id":1}}' >/dev/null; expect "archive succeeds" "OK" "$(err)"
code "$ADMIN" POST operations.archiveInquiry '{"json":{"id":1}}' >/dev/null; expect "archive again is a no-op" "OK" "$(err)"
python3 -c "
import json;d=json.load(open('/tmp/resp.json'))['result']['data']['json']
print(f\"  {'PASS' if d['changed'] is False else 'FAIL'}  the second archive reports no change\")"

echo ""
echo "== status changes are idempotent =="
code "$ADMIN" POST inquiries.updateStatus '{"json":{"id":1,"status":"archived"}}' >/dev/null
expect "setting the same status is accepted without a duplicate action" "OK" "$(err)"

echo ""
echo "== the audit trail records what happened =="
code "$ADMIN" GET operations.auditTrail >/dev/null; expect "admin can read the trail" "OK" "$(err)"
python3 - <<'PY'
import json
d = json.load(open('/tmp/resp.json'))['result']['data']['json']
events = d['events']
actions = [e['action'] for e in events]
print(f"        recorded: {actions}")
for needed in ['inquiry.reveal', 'inquiry.purge', 'inquiry.archive']:
    print(f"  {'PASS' if needed in actions else 'FAIL'}  {needed} is recorded")
denied = [e for e in events if e['outcome'] == 'denied']
print(f"  {'PASS' if denied else 'FAIL'}  the refused deletion attempt is recorded too")
blob = json.dumps(events, ensure_ascii=False)
leaks = [s for s in ['sara.alharthi@example.com', 'john.carter@example.com', '96891234567', '441632960111'] if s in blob]
print(f"  {'PASS' if not leaks else 'FAIL'}  the audit trail contains no personal data {leaks if leaks else ''}")
reasons = [e for e in events if e['action'] in ('inquiry.reveal', 'inquiry.purge')]
print(f"  {'PASS' if all(e['reason'] for e in reasons) else 'FAIL'}  every sensitive action carries a written reason")
PY

echo ""
echo "-----------------------------------------"
echo "passed: $pass    failed: $fail"
[ "$fail" -eq 0 ] || exit 1
