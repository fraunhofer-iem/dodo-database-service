# Mean Fault Correction Efficiency

## Description

The Mean Fault Correction Efficiency describes the development team's capability to respond to bug reports. It assesses if faults were generally corrected within the time frame the organization aims to adhere to for fault corrections.
We calculate this qualitative indicator as the average [Fault Correction Efficiency](FaultCorrectionEfficiency.md) of all resolved issues labeled `bug` (or some other equivalent label).  
A value greater than 1 indicates that faults were not corrected within the desired time. A value less than 1 indicates that faults were corrected within the desired time.

## Calculation

```
(issues[label = "bug", state="closed"]) => {
    fault_correction_efficiencies = [faultCorrectionEfficiency(bug) for bug in issues]
    
    return avg(fault_correction_efficiencies)
}
```

## Related data
- [Issues](Issue.md): `label`, `state`
- [Fault Correction Efficiency](FaultCorrectionEfficiency.md)