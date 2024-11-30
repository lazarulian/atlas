import { Router } from "express";
import peopleRoutes from "./people";

const router = Router();

// Register routes
router.get("/", (req, res) => {
  res.send("Server is running, and the scheduler is active!");
});

router.use("/people", peopleRoutes);

// Add more routes as your application grows
// e.g., router.use('/otherRoute', otherRoutes);

export default router;
