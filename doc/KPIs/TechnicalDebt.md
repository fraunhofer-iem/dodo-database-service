# Technical Debt

## Description
Technical debt describes the effect, which occurs when we as developers take too many shortcuts in a row. Code is added now, which needs fixing or editing later and causes more work overall. This often occurs if the feature deadline and shipping something is more important than doing the thing right.\
Its immediate effect on a project is that it becomes more complex and entangled and that adding new features takes increased time. Thus, the goal is to reduce technical debt, or even better, don't let it buildup.\
As outlined in the paper ["Technical Debt: From Metaphor to Theory and Practice"](https://ieeexplore.ieee.org/abstract/document/6336722) there is a lot of hidden technical debt. This is especially tricky to estimate and consider, since it has no direct effect. Examples of this are software architecture or technology choices (which might have been correct at the time they were made, but they were never revisited). These hidden debts are exceedingly difficult to measure with automated tools, so we try to approximate them by observing the behavior of the product development. Does the time to complete a feature steadily increase? If you add a new feature how many files did you have to change? We propose that you can approximate these hidden parts of technical debt if we observe the development behavior and interpret it correctly. 

 

## Calculation


## Related Data
* [Coupling of Components](CouplingOfComponents.md) we assume this value to increase over time.
* [Time Idea to Market](TimeIdeaToMarket.md) the time idea to market is expected to increase over time.
* [Release Cycle](ReleaseCycle.md) is expected to increase.
* [Development Focus](DevelopmentFocus.md) we measure how many feature vs bugs vs security tickets are closed with every release. The number of feature tickets is expected to decrease.
* [Complexity of Pull Requests](PullRequestComplexity.md) 