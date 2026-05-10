import { Router } from "express";
import { getUserbyUsername } from "../../services/auth/services";
import { requireAuth } from "../../middlewares/auth/jwt";
import { prisma } from "../../lib/prisma";
import { userSelect } from "../../lib/user.dto";

const router = Router();

router.get("/:username", async (req, res) => {
  const { username } = req.params;
  const user = await getUserbyUsername(username);
  if (!user) return res.status(401).json({ error: "User not found" });
  return res.json(user);
});

router.patch("/:username", requireAuth, async (req, res) => {
  try {
    const username = req.params.username as string;
    const userId = (req as any).userId;
    
    // Check if user exists and match the userId
    const userToEdit = await getUserbyUsername(username);
    if (!userToEdit) return res.status(404).json({ error: "User not found" });
    
    if (userToEdit.id !== userId) {
      return res.status(403).json({ error: "Unauthorized to edit this profile" });
    }
    
    const { name, bio, avatarUrl, coverImageUrl } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        bio: bio !== undefined ? bio : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : undefined,
      },
      select: userSelect,
    });
    
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
