# Mean Feature Completion Efficiency

## Description

The Mean Feature Completion Efficiency describes the development team's capability to add features to the project. It assesses if features were generally completed within the time frame the organization aims to adhere to for feature completion.
We calculate this qualitative indicator as the average [Feature Completion Efficiency](FeatureCompletionEfficiency.md) of all issues labeled `enhancement` (or some other equivalent label) that have been resolved since the previous release.  
A value greater than 1 indicates that features were not completed within the desired time. A value less than 1 indicates that features were completed within the desired time.

## Calculation

```
(release, issues[label = "enhancement", state="closed"]) => {
    features = [ feature for feature in issues 
                 if feature.closed_at <= release.created_at and 
                    feature.closed_at >= release.previous().created_at ]

    feature_completion_efficiencies = [featureCompletionEfficiency(feature) for feature in features]
    
    return avg(feature_completion_efficiencies)
}
```

## Related data
- [Issues](Issue.md): `label`, `state`
- [Release](Release.md): `created_at`, `previous` which is currently not part of the schema
- [Feature Completion Efficiency](FeatureCompletionEfficiency.md)