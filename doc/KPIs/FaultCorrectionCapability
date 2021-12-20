# Fault Correction Capability

## Description
The Fault Correction Capability describes the development team's capability to respond to bug reports. In more detail, it assesses the rate of faults corrected within the time frame the organization aims to adhere to for fault correction.  
For this qualitative indicator we take all issues labeled `bug` (or some other equivalent label) into consideration that have been resolved since the previous release.

## Calculation
```
(release, issues[label = "bug", state = "closed"], T_bug) => {
    bugs = [ bug for bug in issues 
             if bug.closed_at <= release.created_at and 
                bug.closed_at >= release.previous().created_at ]

    bugs_corrected_in_time = [ bug for bug in bugs
                               if bug.closed_at - bug.created_at <= T_bug ]

    return |bugs_corrected_in_time| / | bugs | 
}
```

## Related Data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`
- [Release](Release.md): `created_at`, `previous` which is currently not part of the schema

### Notes
I want to put it up to debate if the capability should be calculated using the issue creation and close time. That way, left-over faults will always reduce the capability of future sprints.  
A different approach would be to take the respective pull requests and instead take the branch creation time as starting point for the capability. That way, it's only the implementation time that is assessed with this KPI.