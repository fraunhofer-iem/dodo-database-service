# Fault Correction Rate

## Description

The Fault Correction Rate describes the development team's capability to respond to bug reports.  
It is a quantitative indicator for which we consider all issues labeled `bug` (or some other equivalent tag) that existed at the time of the release.  
The Fault Correction Rate is the amount of closed `bug` issues divided by the total amount of `bug` issues.

## Calculation
```
(release, issues) => {
    closed_bugs = issues[ label = bug, state = closed, closed_at <= release.created_at ] 
    open_bugs = issues[ label = bug, state = open, created_at <= release.created_at ]

    return |closed_bugs| / |closed_bugs| + |open_bugs|
}
```

## Related Data

- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`
- [Release](Release.md): `created_at`