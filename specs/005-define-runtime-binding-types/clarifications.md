# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 14:50

### Q1: Type overlap with composition module
**Context**: The existing composition/ module already defines FacetProvider (with facet, qualifier, priority fields) and FacetRequirement. The new FacetRegistration in registry.ts has nearly identical fields. If both exist, consumers need to understand when to use which.
**Question**: Should FacetRegistration extend or reuse the existing FacetProvider type from composition/, or should it be a separate standalone type? If separate, what is the semantic distinction?
**Options**:
- A: Reuse FacetProvider — FacetRegistration extends or aliases FacetProvider with any additional fields
- B: Keep separate — runtime types are deliberately decoupled from composition types, even if fields overlap
- C: Consolidate — move shared fields to a common base type that both modules import

**Answer**: *Pending*

### Q2: PluginContext reference in BindingResult
**Context**: BindingResult.contexts is typed as Map<string, PluginContext>, but PluginContext already exists in composition/context.ts with methods like require(), optional(), provide(). The Binder creates these contexts, so it needs to know the contract.
**Question**: Should BindingResult reference the existing PluginContext from composition/, or should runtime/ define its own PluginContext type? If existing, should we just import it?
**Options**:
- A: Import existing PluginContext from composition/ — the Binder produces the same context type plugins consume
- B: Define a minimal runtime-specific BoundContext type that the Binder produces, separate from the full PluginContext

**Answer**: *Pending*

### Q3: Synchronous vs async Binder.bind()
**Context**: The spec defines Binder.bind() as returning BindingResult synchronously. However, real-world binding may involve lazy-loading providers, async initialization, or network-based service discovery.
**Question**: Should Binder.bind() return BindingResult synchronously, or should it return Promise<BindingResult> to support async binding scenarios?
**Options**:
- A: Keep synchronous — binding is a startup-time operation with all providers pre-registered
- B: Make async (Promise<BindingResult>) — allows for lazy loading and async initialization
- C: Support both — add an optional bindAsync() method alongside the sync bind()

**Answer**: *Pending*

### Q4: Error classes in interface-only package
**Context**: The design principle states 'Interface over implementation — Define contracts, not code'. However, resolution.ts contains concrete class implementations (FacetNotFoundError, AmbiguousFacetError, CircularDependencyError). Error classes are a common exception to interface-only packages since they need to be instantiable.
**Question**: Is it intentional that resolution.ts contains concrete error classes rather than just error interfaces? Should consuming cores use these classes directly or define their own?
**Options**:
- A: Intentional — error classes are shared across all cores for consistent error handling
- B: Change to interfaces — cores should define their own error implementations matching the interface

**Answer**: *Pending*

