# Coupling of Components

## Description
With this value we measure how tightly coupled the code base is. We can calculate this very detailed by utilizing static analyses, but this would be tailored for every project or at least every programming language / framework. So we decided to approximate this by analyzing pull requests from feature branches towards dev or main.
The idea is to analyse which files repeatatly appear together in a pull request. We then assume that a change in File A also needs a change in File B, thus they are coupled.

## Calculation
Iterate all pull requests, store file combinations inside a hash map. If the same combination occurs again update the counter.


## Data
* [Pull Requests](PullRequests.md) - utilizes fileName/fileId to identify files