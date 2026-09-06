# LENA Core Intelligence Kernel (v1)

The deterministic intelligence layer of LENA. It answers, in code a future
consumer can read without reconstructing domain logic:

- **What is happening?** → `context.signals` (canonical global state, presence, unresolved)
- **Where am I?** → `context.spatial` / `context.focus`
- **What currently matters?** → `context.signals.unresolved`, `context.continuity`
- **What should I focus on?** → `core` (Sacred Core logical view)
- **Where should I go next?** → `guidance` (Next Best Place), always explainable

## One entry point

```ts
import { deriveLenaIntelligence } from "@/features/core-intelligence";

const { context, core, guidance } = deriveLenaIntelligence(situation, {
  previousCoreState,        // optional: focused-hold hysteresis
  graph,                    // optional: connected World Graph adapter
  now,                      // optional clock; deterministic callers pass it
});
```

`context` is the normalized read model (fused once per call).
`core` is the UI-neutral Sacred Core view (state, intensity, urgency, pulse,
attention owner, focus/guidance targets, reasons — never CSS).
`guidance` is the explainable Next Best Place result (mode, destination,
reason code, source signal, structural path).

## Modules & dependency direction

```
canonical LENA runtimes (signals, spatial memory, continuation, registry)
        ↓  (context/adapters.ts — pure mappers, read-only)
LenaContextSnapshot (context/fusion.ts)
       ↙                    ↘
core/state.ts        guidance/planner.ts      graph/GraphContextAdapter.ts
       \                    /                     (seam — interface only)
        LenaIntelligence (index.ts façade)
```

Rules enforced by architecture:
- Context Fusion is **read-only** — no signal ack/resolve, no memory writes,
  no navigation, no graph mutation, no presentation.
- Core State derives **only** from the snapshot (+ optional previous state
  and guidance availability supplied by the façade). It never imports the
  planner; the planner never imports the machine.
- Guidance consumes the snapshot **only**; the graph adapter is used for
  score-tie distance and path metadata, never for severity decisions.
- No UI/CSS semantics anywhere in the kernel. No React in the domain files.

## Graph rule (collision safety)

The kernel never imports Atlas or React. It depends on
`graph/GraphContextAdapter.ts` (a small interface). Production wiring is
`CanonicalWorldGraphAdapter` over the live `@/graph` World Graph.
`InMemoryGraphContextAdapter` remains the deterministic test double;
`emptyGraphContextAdapter` is the fail-closed default when no graph is
supplied. The kernel does not own a second topology.

## Out of scope (later phases)

Living Sacred Core rendering/artwork, eye/gaze behavior, LENA Operator chat,
LLM calls, voice, gesture. This is the brain, not the rendering.
