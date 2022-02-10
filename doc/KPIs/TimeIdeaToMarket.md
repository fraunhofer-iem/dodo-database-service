# Time Idea to Market

## Description
We measure the time it takes from an idea entering the issue board until it is released to the customer.
To calculate this value, we need to differentiate between the various kinds of issues (bugs, features, …). For this distinction, we utilize the ticket's tags.
## Calculation
`Timestamp Release includes Ticket - Timestamp of ticket creation`

## Data
* [Release](Release.md)
* [Issue](Issue.md)

## Need for additional Input / Interpretation
* Which tags are used for which kinds of tickets. This can be semi-automatic, by analyzing all used tags and comparing them to a set of often used tags.