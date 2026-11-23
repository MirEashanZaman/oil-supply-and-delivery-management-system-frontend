"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

/**
 * 21st.dev-style interactive Spotlight Card with cursor-following radial illumination
 * and spring-physics hover elevation.
 */
export function SpotlightCard({
    children,
    className = "",
    spotlightColor = "rgba(15, 39, 71, 0.07)",
}: {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`relative overflow-hidden ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
                style={{
                    opacity,
                    background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
                }}
            />
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
