# Coupling of Components

## Description
Coupling of components measures how tightly coupled the code base is. The higher the value the harder it is to make changes to the codebase.\
This coupling can be calculated with static analyses. The disadvantage of this approach is that every analysis must be tailored to each project or at least to every programming language / framework. So, we decided to approximate this by analyzing pull requests from feature branches towards dev or main.\
The idea is to analyze which files repeatedly appear together in a pull request. We then assume that a change in File A also needs a change in File B, thus they are coupled.

## Calculation
Iterate all pull requests, store file combinations inside a hash map. If the same combination occurs again update the counter.


## Data
* [Pull Requests](PullRequests.md) - utilizes fileName/fileId to identify files