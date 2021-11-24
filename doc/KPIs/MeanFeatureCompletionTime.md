# Mean Feature Completion Time

## Description

The Mean Feature Completion Time describes the development team's capability to add features to the project.  
It is a qualitative indicator for which we consider all issues labeled `enhancement` (or some other equivalent tag). We then calculate `Feature Completion Time` for each completed feature individually and using this we calculate the average resolution time.  

## Calculation

```
(issues) => {
    closed_features = issues[ label = enhancement, state = closed ]
    resolution_times = [feature.closed_at - feature.opened_at for feature in closed_bugs]
    
    return avg(resolution_times)
}
```

## Related data
- [Issues](Issue.md): `label`, `state`, `created_at`, `closed_at`

### Notes
For this to be an actual KPI, we need to define an acceptable target time. Otherwise, this is just a data source.