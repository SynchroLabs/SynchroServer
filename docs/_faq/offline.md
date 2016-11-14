---
title: How do Synchro apps work when offline/disconnected?
weight: 3
---

We get this question a lot.
 
The short answer is that Synchro apps don’t work offline or disconnected.  Your app built with Synchro will need to be
connected to your server in order to function.
 
The first point we always make is that we live in a connected world.  The mobile devices that your users will use to access
your apps are going to be connected a very high percentage of the time, and Synchro is designed to perform well even over
cellular data connections.
 
Most of the time when we discuss the kinds of apps that a prospect is considering implementing in Synchro, we find that
they are apps that don’t really make sense offline.  The line-of-business/enterprise solutions that are really Synchro’s
sweet spot are usually already available via an intranet app, or sometimes even as a server app accessed via a terminal
emulator.  And none of that works offline, nor is there any real user expectation that these apps should work offline.
 
When discussing offline scenarios, it is important to understand that making portions of your app work offline is going
to create significant complexity in design, implementation, and maintenance, regardless of the development platform that
you choose.  While there are some very specific use cases where the offline function of an enterprise app justifies the
expense, it is most often the that when the time comes to actually implement the app, these offline features are the first
to get thrown out.
 
Would it be nice to be able to fill out a time sheet, or open an IT request, when you are offline?  Sure.  But you also
have to ask whether your users have an expectation of being able to do those things offline, and how much incremental budget
(of time and resources) you are willing to commit to achieve that functionality.
 
Consider everything that users can do with a browser over the Internet, and what your users can do on your intranet.  All
of that is connected-only.  If you want to mobilize any of that using Synchro, you’ll be fine.
 
All of that being said, if you must have offline, then you can’t use Synchro :(
