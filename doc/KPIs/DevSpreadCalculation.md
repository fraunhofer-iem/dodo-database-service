# Calculation Developer Spread

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

- Then, **average organization spread** for every time interval is calculated by _summing up all project member's interval spread values in a category_ and set that in relation to _a weight propotional to the contribution amount for a project member_.
- Additionally, a repository related calculation shows the **average project spread**:
  - Therefore, the precomputed category spread values for all project members, who contributed to the specified repository, are being collected.
  - If there is an intersection of commit time intervals for different developers, they are added together.
  - Then, the average spread for every time slot value is calculated in relation to the amount of developers.
  - Finally, the average spread for every time interval in relation to the amount of time interval values is calculated.
- [Implementation](../../src/database/statistics/developerFocus.service.ts)
