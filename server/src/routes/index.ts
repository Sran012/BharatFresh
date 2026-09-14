import { Router } from "express";
import { authRouter } from "./auth.js";
import { buyerRouter } from "./buyer.js";
import { cartRouter } from "./cart.js";
import { notificationsRouter } from "./notifications.js";
import { ordersRouter } from "./orders.js";
import { productsRouter } from "./products.js";
import { sellerRouter } from "./seller.js";
import { sellersRouter } from "./sellers.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/buyer", buyerRouter);
router.use("/seller", sellerRouter);
router.use("/products", productsRouter);
router.use("/sellers", sellersRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/notifications", notificationsRouter);
