# Time To Resolution

## Description
The Time to Resolution describes the development team's capability to respond to bug reports. It assesses the time it took to resolve a single bug report.  
We calculate this information point for resolved issues labeled `bug` (or some other equivalent label).


## Calculation
```
(issue[label = "bug", state="closed"], T_bugfix) => {
    return (issue.closed_at - issue.created_at)
}
```

## Related Data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`
