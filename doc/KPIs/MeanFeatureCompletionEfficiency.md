# Mean Feature Completion Efficiency

## Description

The Mean Feature Completion Efficiency describes the development team's capability to add features to the project. It assesses if features were generally completed within the time frame the organization deems to adhere to for feature completion.
We calculate this qualitative indicator as the average [Feature Completion Efficiency](FeatureCompletionEfficiency.md) of all resolved issues labeled `enhancement` (or some other equivalent label).  
A value greater than 1 indicates that features were not completed within the desired time. A value less than 1 indicates that features were completed within the desired time.

## Calculation

```
(issues[label = "enhancement", state="closed"]) => {
    feature_completion_efficiencies = [featureCompletionEfficiency(feature) for feature in issues]
    
    return avg(feature_completion_efficiencies)
}
```

## Related data
- [Issues](Issue.md): `label`, `state`
- [Feature Completion Efficiency](FeatureCompletionEfficiency.md)