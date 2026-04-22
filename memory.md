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
