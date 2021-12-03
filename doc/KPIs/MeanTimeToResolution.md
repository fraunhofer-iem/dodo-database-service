# Mean Time to Resolution

## Description
The Mean Time to Resolution describes the development team's capability to respond to bug reports. It assesses the overall time it took to resolve bug reports.  
We calculate this information point for resolved issues labeled `bug` (or some other equivalent label).

## Calculation
```
(issues[label = "bug", state="closed"], T_bugfix) => {
    return avg([timeToResolution(bug) for bug in issues])
}
```

## Related Data
- [Issues](Issue.md): `label`, `state`
- [Time To Resolution](TimeToResolution.md)
