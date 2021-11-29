# Feature Completion Capability

## Description
The Feature Completion Capability describes the development team's capability to add features to the project. In more detail, it assesses the rate of features completed within the time frame the organization aims to adhere to for feature completion.  
For this qualitative indicator we take all issues labeled `enhancement` (or some other equivalent label) into consideration that have been resolved since the previous release.

## Calculation
```
(release, issues[label = "enhancement", state = "closed"], T_feature) => {
    features = [ feature for feature in issues 
                 if feature.closed_at <= release.created_at and 
                    feature.closed_at >= release.previous().created_at ]

    features_completed_in_time = [ feature for feature in features
                                   if feature.closed_at - feature.created_at <= T_feature ]

    return |features_completed_in_time| / | features | 
}
```

## Related Data
[Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`
[Release](Release.md): `created_at`, `previous` which is currently not part of the schema