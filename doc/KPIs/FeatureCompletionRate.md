# Feature Completion Rate

## Description

The Feature Completion Rate describes the development team's capability to add features to the project.  
It is a quantitative indicator for which we consider all issues labeled `enhancement` (or some other equivalent tag) that existed at the time of a release.  
The Feature Completion Rate is the amount of closed `enhancement` issues divided by the total amount of `enhancement` issues.

## Calculation
```
(release, issues) => {
    closed_features = issues[ label = enhancement, state = closed, closed_at <= release.created_at, closed_at >= release.previous().created_at ] 
    open_features = issues[ label = enhancement, state = open, created_at <= release.created_at ]

    return |closed_features| / |closed_features| + |open_features|
}
```

## Related Data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`
- [Release](Release.md): `created_at`, `previous` which is currently not part of the schema
