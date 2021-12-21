# Branch Uniqueness

## Description
Branches in gitflow (except main, dev and release) are supposed to be short-lived and implement only a single (small) feature. Therefore, branches are supposed to be deleted after they have been merged into one of the permanent branches.  
With this indicator we can monitor if developers adhere to this principle by counting the amount of merges per feature branch.

## Calculation
1 / | merges from branch |

### Notes
Name is subject to change
