# Mean Fault Correction Time

## Description

The Fault Correction Rate describes the development team's capability to respond to bug reports.  
It is a qualitative indicator for which we consider all issues labeled `bug` (or some other equivalent tag). We then calculate `Fault Correction Time` for each resolved fault individually and using this we calculate the average resolution time.  

## Calculation

```
(issues) => {
    closed_bugs = issues[ label = bug, state = closed ]
    resolution_times = [bug.closed_at - bug.opened_at for bug in closed_bugs]
    
    return avg(resolution_times)
}
```

## Related data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`

### Notes
For this to be an actual KPI, we need to define an acceptable target time. Otherwise, this is just a data source.