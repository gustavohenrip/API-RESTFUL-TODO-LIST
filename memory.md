# Memory

## Fixed Issues

- Spring Security Nimbus key builder expects `com.nimbusds.jose.JWSAlgorithm`, not Spring's `MacAlgorithm`.
- `HttpMessageNotReadableException` must be imported from `org.springframework.http.converter`.
- Angular CLI first-run analytics prompt must be disabled in the launcher with `NG_CLI_ANALYTICS=false` for unattended runs.
- Oversized task panels came from grid stretch behavior plus an aggressive `min-height` on the task list container; keep list rows aligned to `start` and avoid forcing panel height when the content is compact.
- Dev CORS was too narrow when only `http://localhost:4200` was allowed; include `http://127.0.0.1:4200` too so local browser sessions do not break depending on the host alias.
- Text-only branding looked generic; the header works better as a compact symbol plus wordmark, even when the product name stays the same.
- Hover jitter happens when the hovered element moves under the pointer; keep motion on the parent row or on non-hovered siblings instead of translating the element being targeted.
- Generic form copy like "Required" is too vague when validators have real rules; surface the exact constraint, such as minimum length, maximum length, or valid email format.
- Decorative underlines beneath inputs can look off-center and noisy; keep field emphasis on border and shadow instead.
- HS256 JWT secrets must decode to at least 32 bytes; validate at startup through `@PostConstruct` instead of trusting `@NotBlank` alone.
- Bash `cd subdir && git ...` can silently lose the subshell before follow-up calls; use `git -C <abs-path>` whenever multiple git commands need to target the same repository reliably.
- Flyway needs separate migration paths per database vendor when the SQL differs (e.g. `TIMESTAMPTZ` in Postgres vs `TIMESTAMP WITH TIME ZONE` in H2); split migrations under `db/migration/h2` and `db/migration/postgres` and point `spring.flyway.locations` via profile.
- Custom error pages like `/api/health` duplicate Actuator; prefer exposing `management.endpoints.web.exposure.include=health,info` and removing hand-rolled controllers.
- Rate-limit filters must run before Spring's `UsernamePasswordAuthenticationFilter` to protect the login endpoint itself.
- When refactoring Angular to standalone components with routing, prefer `loadComponent` for each route so each feature lazy-loads instead of leaking into the initial bundle.
- `window.confirm` blocks the main thread and cannot be styled; a signal-driven modal exposing an `ask(options): Promise<boolean>` API is the portable replacement.
- Per-task busy state must be tracked with a `Set<id>` signal instead of a single `busy` boolean so toggling one task does not freeze the whole list.
- `@ServiceConnection` plus a `@TestConfiguration` containing `PostgreSQLContainer` is the cleanest way to wire Testcontainers into a Spring Boot 3.5 test slice.
- `ddl-auto: update` is unsafe for a portfolio app; keep Hibernate at `validate` and let Flyway own schema changes.
