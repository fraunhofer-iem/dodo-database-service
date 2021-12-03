# Feature Completion Efficiency

## Description
The Feature Completion Efficiency describes the development team's capability to add features to the project. In more detail, it assesses if a single feature was completed within the time frame the organization aims to adhere to for feature completion.  
We calculate this qualitative indicator for resolved issues labeled `enhancement` (or some other equivalent label).  
A value greater than 1 indicates that the feature was not completed within the desired time. A value less than 1 indicates that the feature was completed within the desired time.

## Calculation
```
(issue[label = "enhancement", state="closed"], T_feature) => {
    return (issue.closed_at - issue.created_at) / T_feature
}
```

## Related data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`