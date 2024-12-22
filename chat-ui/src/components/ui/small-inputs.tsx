import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Input } from "./input";
import { Textarea } from "./textarea";

export const SmallInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>((props, ref) => (
  <Input
    {...props}
    ref={ref}
    className={cn("!text-2xs placeholder:text-2xs", props.className)}
  />
));
SmallInput.displayName = "SmallInput";

export const SmallTextarea = forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>((props, ref) => (
  <Textarea
    {...props}
    ref={ref}
    className={cn("text-2xs placeholder:text-2xs", props.className)}
  />
));
SmallTextarea.displayName = "SmallTextarea";
