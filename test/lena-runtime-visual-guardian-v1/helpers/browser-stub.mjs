/**
 * Launch helper used ONLY by the restricted-sandbox fallback
 * (LENA_LOCAL_BROWSER=1). Not used in CI — CI installs real Chromium system
 * libraries. If the sandbox cannot install system libs, we compile a minimal
 * NSS/NSPR stub set (no-op crypto; tests never talk to TLS endpoints) so the
 * serverless Chromium binary can start. The stubs carry the version nodes the
 * Chromium binary requires at load time.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const C_SOURCE = `#define _GNU_SOURCE
#include <stdint.h>
#include <time.h>
typedef int32_t SECStatus;
typedef void* PRBool;
typedef int64_t PRTime;
#define SECSuccess 0
/* libnspr4 */
void PR_Init(void) {}
PRTime PR_Now(void) { struct timespec ts; clock_gettime(CLOCK_REALTIME, &ts); return (PRTime)ts.tv_sec*1000000 + ts.tv_nsec/1000; }
int32_t PR_GetError(void) { return 0; }
int32_t PR_GetOSError(void) { return 0; }
const char* PR_GetErrorText(void) { return ""; }
int32_t PR_GetErrorTextLength(void) { return 0; }
/* libnss3 */
SECStatus NSS_InitReadWrite(void* a, void* b, void* c, void* d, uint32_t e){return SECSuccess;}
SECStatus NSS_NoDB_Init(void* a){return SECSuccess;}
PRBool NSS_VersionCheck(void* a){return (void*)1;}
void CERT_DestroyCertList(void* a){} void CERT_DestroyCertificate(void* a){}
void* CERT_DupCertificate(void* a){return 0;} void* CERT_FindCertByDERCert(void* a,void* b){return 0;}
SECStatus CERT_GetCertTrust(void* a,void* b){return -1;} void* CERT_GetDefaultCertDB(void){return (void*)1;}
PRBool CERT_IsUserCert(void* a){return 0;} void* CERT_CreateSubjectCertList(void* a,void* b,void* c,uint32_t d,void* e,int32_t f){return 0;}
void PK11_DestroyGenericObjects(void* a){} void* PK11_FindCertInSlot(void* a,void* b,int32_t c){return 0;}
void* PK11_FindGenericObjects(void* a,void* b,int32_t c){return 0;} void PK11_FreeSlot(void* a){}
void* PK11_GetInternalKeySlot(void){return (void*)2;} void* PK11_GetModule(void* a){return 0;}
void* PK11_GetNextGenericObject(void* a,void* b,uint32_t c){return 0;} const char* PK11_GetTokenName(void* a){return "";}
PRBool PK11_HasAttributeSet(void* a,void* b,int32_t c,int32_t d){return 0;} PRBool PK11_HasRootCerts(void* a){return 0;}
SECStatus PK11_InitPin(void* a,void* b,void* c){return SECSuccess;} PRBool PK11_IsPresent(void* a){return 0;}
void* PK11_ListCerts(void* a,void* b,void* c,int32_t d){return 0;} void* PK11_ListCertsInSlot(void* a,void* b,void* c,int32_t d){return 0;}
PRBool PK11_NeedUserInit(void* a){return 0;} SECStatus PK11_ReadRawAttribute(void* a,int32_t b,void* c,void* d){return SECSuccess;}
void* PK11_ReferenceSlot(void* a){return a;} void PK11_SetPasswordFunc(void* a){}
void* SECITEM_AllocItem(void* a, void* b, uint32_t c){static char d[16]; return b?b:d;}
void SECITEM_FreeItem(void* a, void* b){} void SECMOD_DestroyModule(void* a){}
void* SECMOD_GetDefaultModuleList(void){return 0;} void* SECMOD_GetDefaultModuleListLock(void){return (void*)3;}
void* SECMOD_GetReadLock(void){return (void*)4;} int32_t SECMOD_LoadUserModule(void* a,void* b,int32_t c){return 0;}
void SECMOD_ReleaseReadLock(void* a){}
/* libnssutil3 */
SECStatus NSS_SetAlgorithmPolicy(void* a, void* b, void* c){return 0;}
`;

const NSS3_MAP = `NSS_3.2 {
  global:
    CERT_DestroyCertList; CERT_DestroyCertificate; CERT_DupCertificate;
    CERT_FindCertByDERCert; CERT_GetCertTrust; CERT_GetDefaultCertDB;
    NSS_InitReadWrite; NSS_NoDB_Init; NSS_VersionCheck;
    PK11_FindCertInSlot; PK11_FreeSlot; PK11_GetInternalKeySlot;
    PK11_GetTokenName; PK11_InitPin; PK11_IsPresent; PK11_ListCerts;
    PK11_NeedUserInit; PK11_SetPasswordFunc; SECITEM_AllocItem;
    SECITEM_FreeItem;
  local: *;
};
NSS_3.3 {
  global:
    PK11_GetModule; PK11_ListCertsInSlot; PK11_ReferenceSlot;
    SECMOD_DestroyModule; SECMOD_GetDefaultModuleList;
    SECMOD_GetDefaultModuleListLock; SECMOD_GetReadLock;
    SECMOD_ReleaseReadLock;
} NSS_3.2;
NSS_3.4 {
  global: CERT_CreateSubjectCertList; PK11_HasRootCerts; SECMOD_LoadUserModule;
} NSS_3.3;
NSS_3.6 { global: CERT_IsUserCert; } NSS_3.4;
NSS_3.9.2 {
  global:
    PK11_DestroyGenericObjects; PK11_FindGenericObjects;
    PK11_GetNextGenericObject; PK11_ReadRawAttribute;
} NSS_3.6;
NSS_3.30 { global: PK11_HasAttributeSet; } NSS_3.9.2;
`;

const NSSUTIL3_MAP = `NSSUTIL_3.12.3 { global: NSS_SetAlgorithmPolicy; local: *; };
`;

const STUBS = [
  { name: "libnspr4.so", extraArgs: [] },
  { name: "libnss3.so", extraArgs: ["-Wl,--version-script=nss3.map"], map: "nss3.map", mapContent: NSS3_MAP },
  { name: "libnssutil3.so", extraArgs: ["-Wl,--version-script=nssutil3.map"], map: "nssutil3.map", mapContent: NSSUTIL3_MAP },
];

export async function localChromiumOptions() {
  const chromium = (await import("@sparticuz/chromium")).default;
  const executablePath = await chromium.executablePath();

  const stubDir = process.env.NSS_STUB_DIR ?? join(process.env.HOME ?? "/tmp", ".lena-nss-stub");
  mkdirSync(stubDir, { recursive: true });
  let builtAny = false;
  for (const stub of STUBS) {
    const soFile = join(stubDir, stub.name);
    if (!existsSync(soFile)) {
      const cFile = join(stubDir, "stub.c");
      writeFileSync(cFile, C_SOURCE);
      if (stub.mapContent) {
        const mapPath = join(stubDir, stub.map);
        writeFileSync(mapPath, stub.mapContent);
        const result = spawnSync(
          "gcc",
          ["-shared", "-fPIC", "-o", soFile, cFile, `-Wl,--version-script=${mapPath}`],
          { stdio: "ignore" },
        );
        if (result.status === 0) builtAny = true;
        continue;
      }
      const result = spawnSync("gcc", ["-shared", "-fPIC", "-o", soFile, cFile], {
        stdio: "ignore",
      });
      if (result.status === 0) builtAny = true;
    }
  }

  const existing = STUBS.map((stub) => join(stubDir, stub.name)).filter((path) => existsSync(path));

  const libraryPath = existing.length
    ? [stubDir, process.env.LD_LIBRARY_PATH ?? ""].filter(Boolean).join(":")
    : process.env.LD_LIBRARY_PATH ?? "";

  // --single-process / --in-process-gpu make the serverless binary crash after
  // a few pages in this sandbox; drop them. CI never uses this path anyway.
  const args = chromium.args.filter(
    (arg) => arg !== "--single-process" && arg !== "--in-process-gpu" && arg !== "--no-zygote",
  );

  return {
    executablePath,
    args,
    env: { ...process.env, LD_LIBRARY_PATH: libraryPath },
    builtAny,
  };
}
