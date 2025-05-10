"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function WhatWeBelievePage() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-between">
      {/* Page Content */}
      <div className="px-6 py-16">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            What We Believe
          </motion.h1>

          {/* Belief Statements */}
          <motion.div
            className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-6 text-lg leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-yellow-400 font-semibold text-center text-lg mb-6">
              THE LIGHT'S HOUSE STATEMENT OF BELIEF
            </p>

            <p>We believe the Bible is inspired and empowered by God, infallible, and authoritative.</p>
            <p>We believe in one eternal God who exists as three separate persons: the Father, Son, and Holy Spirit.</p>
            <p>
              We believe Jesus Christ is the Son of God, born of a virgin, lived a sinless life, demonstrated the authority and power of God, died on the cross, rose from the dead on the third day, and is now seated at the right hand of God having accomplished all that is necessary for man’s salvation.
            </p>
            <p>
              We believe it is essential for man to repent of sin and by faith receive the finished work of Christ by confessing Him as Lord and believing in his heart, resulting in regeneration by the Holy Spirit.
            </p>
            <p>
              We believe the Holy Spirit is continuing the work He started at Pentecost, empowering believers to live a godly life and continue in all the works of Jesus.
            </p>
            <p>
              We believe in the imminent return of Jesus and that those who have believed in Him will be resurrected to a heavenly dwelling, and those who do not believe will face everlasting punishment.
            </p>
            <p>
              We believe the true Church is composed of all born-again believers in Christ, regardless of denominational affiliation.
            </p>
            <p>
              We believe all born-again believers have been commissioned to share the complete Gospel with the whole world.
            </p>
            <p>
              We believe that everything needed for living a godly life has already been provided, and the key is continuous renewal of the mind.
            </p>
          </motion.div>

          {/* Download PDF Button */}
          <motion.div
            className="flex justify-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <a
              href="/beliefs.pdf" // PDF must be placed inside /public/beliefs.pdf
              download
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600 transition"
            >
              Download PDF
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
