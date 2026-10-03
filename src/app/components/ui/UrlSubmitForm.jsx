"use client";

import { Button, Form, InputGroup, Kbd, Spinner, TextField, Tooltip } from "@heroui/react";
import { ArrowRight, X } from "lucide-react";

export default function UrlSubmitForm({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  icon,
  isLoading = false,
  submitLabel = "Fetch",
  hint,
}) {
  const isDisabled = !value?.trim() || isLoading;

  return (
    <Form className="flex w-full flex-col gap-3" onSubmit={onSubmit}>
      <TextField
        aria-label={placeholder}
        className="w-full"
        fullWidth
        value={value}
        onChange={onChange}
      >
        <InputGroup fullWidth className="rounded-full">
          {icon ? (
            <InputGroup.Prefix className="rounded-s-full">{icon}</InputGroup.Prefix>
          ) : null}
          <InputGroup.Input placeholder={placeholder} />
          <InputGroup.Suffix className="rounded-e-full pe-1 flex items-center gap-1">
            {value && onClear ? (
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    aria-label="Clear input and results"
                    className="text-muted hover:text-foreground"
                    isDisabled={isLoading}
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={onClear}
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Clear</Tooltip.Content>
              </Tooltip>
            ) : null}
            <Button
              aria-label={submitLabel}
              isDisabled={isDisabled}
              isIconOnly
              type="submit"
            >
              {isLoading ? (
                <Spinner color="current" size="sm" />
              ) : (
                <ArrowRight aria-hidden="true" className="size-4" />
              )}
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
      {hint ? (
        <p className="text-center text-xs text-muted">
          Press{" "}
          <Kbd className="h-auto px-1 py-px text-[10px] font-normal leading-none">
            <Kbd.Content>Enter</Kbd.Content>
          </Kbd>{" "}
          {hint}
        </p>
      ) : null}
    </Form>
  );
}
