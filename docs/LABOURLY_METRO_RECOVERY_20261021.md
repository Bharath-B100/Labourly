# Metro connectivity recovery — 21 October 2026

**BLOCKED: configured emulator-to-Metro status connectivity corrected; bundle and startup acceptance remain unverified because the resource prerequisite failed.**

## Evidence and correction

- Read-only app preferences identify `debug_http_host=10.0.2.2:8083`. SecureStore was not read or changed.
- Original Metro PID 5492 listened on `::1:8083`, started with `--localhost`. Host IPv6 status returned HTTP 200; host IPv4 was refused. Device `10.0.2.2:8083` timed out.
- Existing adb reverse: `tcp:8083 tcp:8083`. The app uses 10.0.2.2 directly, not this reverse path.
- Stopped only the verified Metro process, restarted using the same CLI, port, one worker and 768 MiB Node heap, adding process-only `--dns-result-order=ipv4first`. New PID 22116 listens on `127.0.0.1:8083`. No project/environment file or dependency changes.
- Reapplied the same adb reverse mapping. Device localhost still returned no HTTP response, so that alternate route is NOT validated. It is not required for the actual configured 10.0.2.2 connection.
- Device-side HTTP request using Android `printf` piped to toybox netcat returned **HTTP 200 and packager-status:running** through **10.0.2.2:8083** after the binding change. Host IPv4 status also succeeds. This before/after device evidence supports binding mismatch as the status connectivity defect.
- Earlier raw stdin probes produced an HTTP 400 or empty response due to their transport/input method; preserved but not treated as successful endpoint tests. The final correctly formatted device probe is `status-device-printf.json`.
- Firewall profiles remain enabled and unchanged. Success through the actual device route without firewall changes means no firewall change is necessary for that route. This is not a comprehensive firewall audit.
- Isolated backend 8084 health UP; mobile API URL unchanged. No APK rebuild or installation performed.

## Resource gate and stop

Available host RAM measured 981 MiB initially, 815 MiB after Metro restart and **740 MiB** at the final check. Guest MemAvailable was 666,284 KiB (about 651 MiB). Host memory is below the existing 1,024 MiB operational cold-start guard. These are local test guards, not universal platform specifications.

**No bundle request/build or app cold start was attempted after that failed prerequisite.** Bundle delivery, JS initialization, authenticated Home, root/linking behavior and ANRs for a recovered launch remain PENDING. Exactly zero launches in this recovery task; no reload, recreation, data clearing or protected-record changes. The existing emulator remains open; Metro and isolated backend remain running.

Next: free host memory, verify the actual JavaScript bundle endpoint from the emulator, then perform one authorized controlled cold start only if both delivery and resource checks pass. Do not rebuild the already verified APK merely to correct this development connection.

Private evidence: `.tools/metro-recovery-20261021/` contains before/after probes and new Metro logs. Application source, dependencies, production configuration, migrations and protected records were not changed. No commit, push, tag or deployment.
