---
title: "Won't Synchro be slow running from the cloud?"
weight: 2
---

### Will my Synchro app be really slow if it’s running in the cloud?  What if I’m connected over a cellular data connection, won't that be a problem?
 
# Short Answer: No
 
Our goal from the very beginning with Synchro was to have great performance, ideally indistinguishable from native local
apps, even over cellular data connections.  This was one of the biggest design challenges that we faced, and the constraints
that it implied influenced our entire architecture.  Separating the client view from the application logic over the Internet
is only a good idea if you can do it FAST.
 
We believe the we’ve shown that Synchro apps are actually very responsive, even over slower connections.  You can try our
various sample apps and see for yourself.
 
# Need to be convinced with gory details?  Read on.
 
We spent a lot of time doing tests on user expectations regarding response time.  We studied how long we can take to load
a page/view before the user perceives a delay, and how long after the user takes an action we have to reflect that action in
the UX, among other scenarios.  The result of this testing was that we determined that we had a budget of about 250ms from user
action to that action being reflected on screen (whether that action was a new page/view or an update to an existing page/view).
 
Each transaction between the Synchro client and the Synchro app server is conducted over an HTTP connection (typically).  The
factors influencing the performance of a transaction include network latency, network throughout, session management, request
processing overhead, and the time spent by the application code itself.
 
Network latency is one of the largest factors impacting the transaction time.  In WIFI environments, the network latency is
typically very low.  On cellular networks, contemporary platforms (LTE) typically have latency in the 75ms range, and with
older platforms (3G, 4G) there can be as much as 100-125ms of latency.  We have studied the latency of different cellular
network technologies and providers, and we’ve seen the direction that cellular latency is going.  We expect to see these
latencies continue to drop significantly over the near term. 
 
Network throughput can be a significant constraint for applications that send a lot of data.  We have done our best to
minimize the impact of network throughput by being very concise in what we send and receive.  Our data volumes are
significantly less than a web app, for example, as we send a very concise (abstract) description of the view, along with
the data to populate it, and we let the native client application do most of the work of making it look right (and we also
aren’t sending any stylesheets or JavaScript files in addition to the main page/view description like a web app would).
 
We are also very conservative in the data that goes back and forth after the initial page load.  First, we only ever send
differences to the view model in either direction.  Second, we only send view model changes to the server when they are
needed by server application logic (we use a technique called “dynamic local binding” that lets us update the client UX
based on client interactions that update the view model without sending those view model updates back to the server
unless/until they are needed).
 
Session management is something that can easily chew up 100ms per transaction if it is not managed well.  Synchro has a
variety of supported session manager backends, but our favorite for production systems is Redis.  On our production system
running on Microsoft Azure, we have a managed Redis server located in the same datacenter as our API server, and we see
latency of 2-3ms for a session read, and 10-12ms for a session write (a typical transaction will include one read and one
write).
 
When looking at all of these factors, we have about 50ms left for your Synchro logic to execute per transaction and still
stay safely within our 250ms budget.  That is plenty of time to execute synchronous application logic.  If your application
logic is asynchronous or long-running, we have support in our framework for you to do those things without blocking the UX.
