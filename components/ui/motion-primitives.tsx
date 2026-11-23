"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

/**
 * Clean 21st.dev interactive card with spring-physics hover elevation and zero glow effects.
 */
export function SpotlightCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`relative overflow-hidden ${className}`}
        >
            <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
        </motion.div>
    );
}

/**
 * motion.dev spring-animated number counter for live telemetry and KPI figures.
 */
export function AnimatedMetricValue({
    value,
    decimals = 0,
    prefix = "",
    suffix = "",
    className = "",
}: {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}) {
    const spring = useSpring(value, { stiffness: 140, damping: 22, mass: 0.6 });
    const display = useTransform(spring, (current) => {
        const formatted = current.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        return `${prefix}${formatted}${suffix}`;
    });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span className={`font-mono tabular-nums ${className}`}>{display}</motion.span>;
}

/**
 * 21st.dev live telemetry oscilloscope wave bar for real-time flow & velocity HUDs.
 */
export function LiveTelemetrySpark({
    color = "#38BDF8",
    active = true,
}: {
    color?: string;
    active?: boolean;
}) {
    const bars = [0.35, 0.7, 0.5, 0.95, 0.6, 0.85, 0.45, 0.9, 0.55, 0.75];
    return (
        <div className="flex items-end gap-[2px] h-4" aria-hidden="true">
            {bars.map((h, i) => (
                <motion.span
                    key={i}
                    className="w-[2.5px] rounded-full"
                    style={{ backgroundColor: color }}
                    animate={
                        active
                            ? {
                                  height: [
                                      `${Math.max(20, h * 55)}%`,
                                      `${Math.min(100, h * 100)}%`,
                                      `${Math.max(25, h * 40)}%`,
                                  ],
                              }
                            : { height: "30%" }
                    }
                    transition={{
                        duration: 1.1 + (i % 3) * 0.25,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                        delay: i * 0.07,
                    }}
                />
            ))}
        </div>
    );
}
