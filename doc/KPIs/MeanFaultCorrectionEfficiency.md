# Mean Fault Correction Efficiency

## Description

The Mean Fault Correction Efficiency describes the development team's capability to respond to bug reports. It assesses if faults were generally corrected within the time frame the organization aims to adhere to for fault corrections.
We calculate this qualitative indicator as the average [Fault Correction Efficiency](FaultCorrectionEfficiency.md) of all issues labeled `bug` (or some other equivalent label) that have been resolved since the previous release.  
A value greater than 1 indicates that faults were not corrected within the desired time. A value less than 1 indicates that faults were corrected within the desired time.

## Calculation

```
(release, issues[label = "bug", state="closed"]) => {
    bugs = [ bug for bug in issues 
             if bug.closed_at <= release.created_at and 
                bug.closed_at >= release.previous().created_at ]
                
    fault_correction_efficiencies = [faultCorrectionEfficiency(bug) for bug in bugs]
    
    return avg(fault_correction_efficiencies)
}
```

## Related data
- [Issues](Issue.md): `label`, `state`, `closed_at`
- [Release](Release.md): `created_at`, `previous` which is currently not part of the schema
- [Fault Correction Efficiency](FaultCorrectionEfficiency.md)