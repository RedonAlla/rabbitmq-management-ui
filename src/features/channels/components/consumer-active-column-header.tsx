import { ArrowRightIcon, InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ConsumerActiveColumnHeader() {
  return (
    <Tooltip>
      <TooltipTrigger>
          <span className="font-medium inline-flex shrink-0 gap-1 items-center justify-center">
            Notifications
            <InfoIcon size={15} />
            </span>
            
        </TooltipTrigger>
        <TooltipContent className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 opacity-80">
              <p>Whether the consumer is active or not, i.e. whether the consumer can get messages from the queue. When single active consumer is enabled for the queue, only one consumer at a time is active. When single active consumer is disabled for the queue, consumers are active by default. For a quorum queue, a consumer can be inactive because its owning node is suspected down.</p>
            </div>
            <a
              target="_blank"
              href="https://www.rabbitmq.com/docs/consumers#active-consumer"
              className="flex items-center gap-1 font-medium underline underline-offset-2"
            >
              Documentation
              <ArrowRightIcon  className="size-3.5" />
            </a>
          </div>
        </TooltipContent>
    </Tooltip>
  );
}
