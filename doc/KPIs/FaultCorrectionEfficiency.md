# Fault Correction Efficiency

## Description
The Fault Correction Efficiency describes the development team's capability to respond to bug reports. In more detail, it assesses if a single fault was corrected within the time frame the organization aims to adhere to for fault corrections.  
We calculate this qualitative indicator for resolved issues labeled `bug` (or some other equivalent label).  
A value greater than 1 indicates that the fault was not corrected within the desired time. A value less than 1 indicates that the fault was corrected within the desired time.

## Calculation
```
(issue[label = "bug", state="closed"], T_bugfix) => {
    return (issue.closed_at - issue.created_at) / T_bugfix
}
```

## Related data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`