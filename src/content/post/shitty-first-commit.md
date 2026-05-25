---
title: "sandesh/shitty-first-commit"
description: "A personal essay on why starting with messy code is the only way to eventually build something good."
publishDate: "2026-04-21"
tags: ["engineering"]
---
`*Hi, I just wrote this as a fun writing, not meant to be taken seriously lol.*`

I suppose programmers of genuine talent may well have existed at some point in the history of computing, but I strongly doubt that one has ever pushed to main with the serene confidence and intellectual composure of the engineers I have read about in books. Reading the GitHub profiles of the truly great, one cannot help but be struck by the overwhelming cleanliness of their commit histories. Think of the abstractions, the test coverage, the variable names springing from these voracious readers of documentation, who are nimble with the type system, savvy in the ways of memory management, and full-time of the pull request. I know some very great programmers, engineers whose code you'd read and feel embarrassed by your own, and not one of them sits down routinely feeling wildly enthusiastic and confident. Not one of them writes elegant first commits. Very few of them really know what they are building until they've built it. For me and most of the other programmers I know, coding is not some beautiful thing. In fact, the only way I can get anything built at all is to write really, really shitty first commits.

If one of the voices in your head wants to hardcode everything and name your variable something, you let her. No one is watching. And if you want to name your files thing, thing2, theThing, actualThing, temp, newTemp, temp2, data, theData, actualData, result, result2, finalResult, finalResultActual, you let her too. I don't even remember what I used to call mine. You let yourself get into really sloppy, embarrassing, copy pasted territory and just get it down on screen because there may be something in that terrible nested loop, in that function you'd never show anyone, that you would never have gotten to by more careful, rational design. Something in the very last line of the very last function that is so clarifying or strange that you now know what you are actually building, more or less, or in what direction it needs to go. There is no way to get there without first getting through the mess. You want to skip it. You can't.

So I'd start writing without reining myself in, just making my fingers move. And the code would come out in one long function that was forty lines long even though it should have been five, and then I'd start building out logic branch by branch, and the variable names would be insane. They'd be pretending to handle edge cases, failing at every one, no matter how hard I tried to rein it down, no matter how conscious I was of what a mess it was. The whole thing would be so long and incoherent and hideous that for the rest of the day I'd obsess about getting hit by a car before I could write a decent second draft. I'd worry that people would read what I'd written and believe that the accident had really been a suicide, that I had panicked because my talent was waning and my mind was shot.

It was a Tuesday night somewhere in the valley between version 0.1 and something that actually runs, and I was in an "oh shit, this happened" moment. Soju bottle and my head blinking, likely because I slept at 4am the day before too. I promised it would stop at 2am every time. Six hours. Six hours for one function. And it still didn't compile. But so what? I thought. This is how it works. This is how it has always worked.

The next day, I'd sit down, go through it all with fresh eyes, take out everything I possibly could, find the logic buried somewhere in the middle, figure out a clean place to end it, and write a second draft. It always turned out fine.

A year ago I was assigned a ticket in the great project management system of a software startup of some local reputation, to work alongside Mr. Senior Engineer and Mr. Tech Lead on a feature described only as the onboarding flow, a phrase so broad as to constitute not a specification but a philosophical position. I felt at the time that I possessed one considerable advantage over others, and that was: enthusiasm. My first real feature ticket, and it was a good opportunity, a chance to demonstrate to my senior engineer, a woman of formidable patience and narrowing goodwill, that I was the kind of programmer who wrote clean, deliberate, already-knowing-where-it-was-going code. If this codebase had any idea how thoroughly I was about to violate its architecture, it had another think coming. My goal in life was elegant software, and I would frankly rather have been debugging a kernel panic or a race condition, except those problems never presented themselves, while this ticket, which had been sitting in the backlog for six weeks and was described only as "fix," not only required my attention but had somehow been assigned to me personally.

I thought I should burst with indignation. I had been handed a four hundred and twenty line function called handleOnboarding whose internal logic had the narrative structure of a fever dream. I opened my editor and the blinking cursor let me in. The function was a single file architecture, with inline comments papering the walls of its logic. And so I started.

The next morning the reviewer had added only this:



> *SIGNIFICANT. Mr. Sandesh, it will be observed, is suggestively silent about the two hundred and forty line function.*



During the remainder of the sprint, this reviewer never referred to me in any other way than as the infamous Sandesh, author of the function. Next came a Slack message, with this:



> *WANTED TO KNOW. Will the junior developer deign to explain to certain of his fellow engineers the small matter of his last three commits being pushed directly to main at two in the morning, without so much as a branch, a review, or apparently any familiarity whatsoever with the concept of version control? Mr. Sandesh has been reached for comment. He said, and we quote directly: "oh no."*



Could anything be more deliberately malicious. I had been trying to move fast. Nobody had told me about the branch policy explicitly. There had been a wiki page, yes, but nobody reads the wiki. I can lay my hand upon the keyboard and swear that I had genuinely believed the answer had a positive score and therefore could be trusted absolutely.



> *// Here it is, buckle the fuck up, because I'm about to unleash the straight,*

> *// brutal, no nonsense version, the raw, unfiltered core of exactly what you*

> *// need and nothing else is still in the commit git history*



Then came the accusation that I had been writing my commit messages in the past tense when the convention, clearly stated in the contributing guide that I had not read, was present tense imperative. This drove me to the verge of distraction. After the review, the senior engineer told me how instructive the experience had been for the team and that of all the junior developers she had encountered, I was the one who had most expanded her understanding of what was possible in a single commit.

I once had a commit that caused three separate incidents, a postmortem, and a new section in the team's engineering handbook titled Considerations Before Merging. The section did not mention me by name. It did not need to. Everyone knew. The commit message had said should be fine and nothing about that sentence was accurate, because you cannot write software without believing, at least briefly, that it should be fine.

I suppose programmers of genuine technical elegance may well exist somewhere in the industry, but I have not met them, and I have been coding long enough that their continued absence from my life has begun to feel less like coincidence and more like a verdict. I have met many programmers. I have reviewed their code and they have reviewed mine and in these exchanges I have learned that every codebase, no matter how clean its surface, has a room you are not supposed to open and a commit you are not supposed to read.

The shitty first commit has not been edited in the direction of anyone. It is written by a person who has temporarily forgotten that other people exist, which is a condition usually associated with very early childhood and certain meditative states and 3am on a Wednesday when the deadline is Thursday and you have stopped caring what anyone thinks because you have a more pressing problem, which is the function that will not compile. In this state I have produced code that is wrong in extremely interesting ways. And I have come to understand, over time, that this state of not caring is not a failure of professionalism but a form of freedom. Something closer to freedom from the performance of competence.

Now there is the layer of the person I am now, who names things correctly and structures things logically and leaves comments that illuminate. Below that is the layer of the person I was six months ago. I will not apologize for it. I have tried. I am constitutionally unable. The shitty first commit is the most honest work I have ever done and the cleanest second draft I have ever written was built entirely on top of it. You get it down first. Everything else is just what you do to make it presentable. Which is also necessary. Which is also good. But the first thing, that was the truest version. And I keep it. I keep it the way you keep the photographs you never post. Not to show anyone. Just so that something somewhere knows it happened.

I was not equal to the requirements of a production codebase in the state of that startup, and so I opened a new branch, named it sandesh/shitty-first-commit, and pushed my terrible, embarrassing, wonderful first draft, which I had been trying to hide for two weeks, and submitted it for review. It was, in the end, fine. The senior engineer said as much, in her way, which was to approve it without comment and move on.

> *// Truly yours, once a man of quiet dignity, but now*

> *// SANDESH B., author of the two hundred and forty line function :(*
