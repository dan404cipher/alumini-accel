const mongoose = require("mongoose");

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://vaccel:PlHUbhJ3iUnbMOHU@v-accel-suites.rqyglx.mongodb.net/aluminiaccel?retryWrites=true&w=majority&appName=v-accel-suites"
  )
  .then(async () => {
    console.log("Connected to MongoDB");
    console.log("Database name:", mongoose.connection.db.databaseName);

    // List all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "Collections in database:",
      collections.map((c) => c.name)
    );

    // Get the Event model
    const Event = mongoose.model(
      "Event",
      new mongoose.Schema({}, { strict: false })
    );

    // Find all events
    const events = await Event.find({}).select("title image");
    console.log(`Found ${events.length} events in database:`);
    events.forEach((event) => {
      console.log(`- ${event.title}: ${event.image || "NO IMAGE"}`);
    });

    // Also check if there are any documents in the events collection directly
    const eventsCollection = mongoose.connection.db.collection("events");
    const count = await eventsCollection.countDocuments();
    console.log(`Direct collection count: ${count}`);

    if (count > 0) {
      const sampleEvents = await eventsCollection.find({}).limit(3).toArray();
      console.log("Sample events from direct collection:");
      sampleEvents.forEach((event) => {
        console.log(`- ${event.title}: ${event.image || "NO IMAGE"}`);
      });
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
