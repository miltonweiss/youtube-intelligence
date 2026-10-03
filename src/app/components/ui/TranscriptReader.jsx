"use client";

import { Modal, ScrollShadow } from "@heroui/react";
import { motion } from "framer-motion";

export default function TranscriptReader({ state, title = "Transcript", text }) {
  return (
    <Modal state={state}>
      <Modal.Backdrop variant="blur">
        <Modal.Container className="p-3 sm:p-6">
          <Modal.Dialog className="flex h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-5xl flex-col sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]">
            <Modal.CloseTrigger />
            <Modal.Header className="shrink-0">
              <Modal.Heading className="line-clamp-1 pr-8">{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="min-h-0 flex-1 py-4 sm:px-10">
              <ScrollShadow hideScrollBar className="h-full py-2" size={60}>
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto max-w-3xl whitespace-pre-wrap text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9"
                  initial={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.12, duration: 0.3, ease: "easeOut" }}
                >
                  {text}
                </motion.p>
              </ScrollShadow>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
