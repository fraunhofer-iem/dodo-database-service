# Modification Correctness

## Description
The Modificiation Correctness describes the capability of the development team to add features to the project.  
In contrast to the [Feature Completion Rate](FeatureCompletionRate.md), the Modification Correctness does not assess the raw amount of features added to the project, but the implementation quality of each feature.  
We calculate this indicator by observing the files changed or added in pull requests from feature branches. By counting the amount of files that were changed in pull requests from branches fixing bugs, we approximate the Modification Correctness.

## Calculation
```
(feature_pr, bug_prs) => {
  files = feature_pr.files

  bug_prs = bug_prs[ updated_at >= feature_pr.merged_at ]

  changed_file_count = | amount of files changed in at least 1 bug PR |

  return 1 - (changed_file_count / | files |)
}
```

## Related Data

[Pull Requests](PullRequests.md): `updated_at`, `files`

### Notes
* It might be a good idea to also consider other feature pull requests that change files in the current feature pull requests (instead of just bug pull requests)
* A file changed in multiple later pull requests is not weighed any differently to a file that has been changed only once. I don't think this makes the approximation less valid.
* This works well for historical data but for new pull requests it is basically always 1.
