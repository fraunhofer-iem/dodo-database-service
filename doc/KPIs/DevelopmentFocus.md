# Development Focus

## Description

We want to know how much the developers need to spread themselves between different projects.  
Therefore, we measure the contributions of every project member across all projects to assess how much context switches are happening. This describes the developer spread.
Additionally, we track the kind of tickets every developer works on to see how much work is spent doing bug fixes vs feature development.
This is then averaged across all developers for each project to get an estimate how the effective work distribution is for every project.

## Calculation Developer Spread

- We look at every organization's repository and store all commits of all project members, who had contributed to that project.
  - The `timestamp` and the `developer login` identify a commit in a repository.
- The **average spread** is calculated for every single project member of the organization in the first place:

  - If `Dev1` committed in `Repo A`, `Repo B` and `Repo C` on `02.03.21`, that would lead to a spread of **3** for that single date.
  - We calculate **average spread values** for the time intervals `days`, `weeks`, `sprints` (two week intervals) and `months`.
  - Assume the following example activity tables for `Dev1`, where letters _A, B, C_ and _D_ denote the contributed repositories and the last row denotes the `day Spread`:

    - Week 1:
      | Mo | Tu | We | Th | Fr |
      |----:|----:|----:|----:|----:|
      | A | A | B | B | A |
      | - | C | - | - | B |
      | 1 | 2 | 1 | 1 | 2 |

      Week 2:
      | Mo | Tu | We | Th | Fr |
      |----:|----:|----:|----:|----:|
      | A | B | B | D | A |
      | C | D | - | - | B |
      | 2 | 2 | 1 | 1 | 2 |

    - **week spread** for _week 1_ is **3**, as there were contributions to different repositories _A, B, C_.
    - **week spread** for _week 2_ is **4**, as there were contributions to different repositories _A, B, C, D_.
    - **avg week spread** then is `(3+4)/2 = 3.5`

  - The same computation holds for the over time intervals.

- Then, **average organization spread** for every time interval is calculated by _summing up all project member's interval spread values in a category_ and set that into _relation to the amount of project members_.
- Additionally, a repository related calculation shows the **average project spread**:
  - Therefore, the precomputed category spread values for all project members, who contributed to the specified repository, are being collected.
  - If there is an intersection of commit time intervals for different developers, they are added together.
  - Then, the average spread for every time slot value is calculated in relation to the amount of developers.
  - Finally, the average spread for every time interval in relation to the amount of time interval values is calculated.
- [Implementation](../../src/database/statistics/developerFocus.service.ts)

## Calculation Issue Labels

- We look at every organization's repository and store all issues for that project.
- Then, we filter out all issues, which are **labeled** and which are **assigned** to a project member.
  - Issues have default labels such as `bug`, `enhancement` or `documentation`.
  - Also, organization's own labels are taken into account.
- For every project member, we want to monitor, on how much tickets with the same label a developer works on **in avarage** per time interval:
  - The calculation period is ranged from the earliest creation date until the current date of computation, as not every issue is closed yet.
  - The issues are then divided among the time intervals `days`, `weeks`, `sprints` and `months` relating to their duration time.
  - Assume `Dev1` has the following ticket timeline, where the first row is the _creation date_ and the last row is the _closing date_:
    - | bug      | feature  | bug      |
      | -------- | -------- | -------- |
      | ticket 1 | ticket 2 | ticket 3 |
      | 01.10.21 | 01.10.21 | 03.10.21 |
      | 14.10.21 | 21.10.21 | -        |
    - Let's assume, the compuation date is the **30.10.21**, then the period is from **01.10.21 - 30.10.21**.
    - This leads to intervals of **30 days**, **4 weeks**, **2 sprints** and **1 month**.
    - To calculate e.g. the **bug avarage** for `Dev1`, we add 14 days for _ticket 1_ and 27 days for _ticket 3_ and got `(14+27)/30 = 1,36` bug fixes per day or we add 2 _(ticket 1 & ticket 3)_ and again 2 and 2 times _ticket 3_ and get `(2+2+1+1)/4 = 1.5` bug fixes per weak.
  - The same calculation holds for the other lables and time intervals.
- Then, the **average ticket number** for each time interval for the **whole organization** or **one project** is being calculated, as all _ticket label amounts_ per project member are being summed up and set into relation to the amount of project members.

## Data

- [Issues](Issue.md) the tags, the assignee and the creation and closing date
- [Developer](Developer.md) the name/id to cross reference with tickets
- [Projects](Project.md) the main data source; repository id and linked data
- [Organization](Organization.md) the projects and their project members
- [Commits](Commit.md) the login and the timestamp
- [Lables](Lable.md) the tag of a lable
