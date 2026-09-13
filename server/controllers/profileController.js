import Employee from "../models/Employee.js";
import User from "../models/User.js";

// GET profile
// GET /api/profile
export const getProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) {
            // Authenticated user is an Admin
            const user = await User.findById(session.userId);
            
            // Format fallback name from email if not explicitly set
            let displayName = user?.name || "";
            if (!displayName && session.email) {
                const prefix = session.email.split("@")[0].replace(/[0-9_.-]+/g, " ").trim();
                displayName = prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "Admin";
            }
            if (!displayName) displayName = "Admin";

            return res.json({
                firstName: displayName,
                lastName: "",
                name: displayName,
                email: session.email,
                position: "Administrator",
                bio: user?.bio || "",
                isAdmin: true
            });
        }
        return res.json(employee);
    } catch (error) {
        console.error("Failed to get profile:", error);
        res.status(500).json({ error: "Failed to get profile" });
    }
};

// UPDATE profile
// POST /api/profile or PUT /api/profile
export const updateProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) {
            // Authenticated user is an Admin - update User document
            const { name, firstName, bio } = req.body;
            const updatedName = name || firstName;
            await User.findByIdAndUpdate(session.userId, {
                ...(updatedName && { name: updatedName.trim() }),
                ...(bio !== undefined && { bio })
            });
            return res.json({ success: true, message: "Admin profile updated" });
        }

        if (employee.isDeleted) {
            return res.status(403).json({ error: "Your account is deactivated. You cannot update your profile." });
        }

        await Employee.findByIdAndUpdate(employee._id, {
            bio: req.body.bio
        });
        return res.json({ success: true });
    } catch (error) {
        console.error("Failed to update profile:", error);
        return res.status(500).json({ error: "Failed to update profile." });
    }
};

// DELETE profile (Soft delete)
// DELETE /api/profile/:id
export const deleteProfile = async (req, res) => {
    // Soft delete logic if needed
};
