import {
  MessageSquareIcon,
  SendIcon,
  TimerIcon,
  UsersIcon,
} from "lucide-react";
import { KpiCard, KpiGrid } from "@/components/kpi";
import type { Channel } from "@/data/types";
import { fmtInt, fmtRate } from "@/lib/format";

type Props = {
  channel: Channel;
  subscriptions: number;
};

export default function ChannelKpis({ channel, subscriptions }: Props) {
  return (
    <KpiGrid>
      <KpiCard
        label="Consumers"
        value={fmtInt(channel.consumers)}
        detail={`${subscriptions} subscriptions`}
        icon={<UsersIcon aria-hidden="true" />}
      />
      <KpiCard
        label="Unacked"
        value={fmtInt(channel.unacked)}
        detail="Awaiting acknowledgement"
        tone="warning"
        icon={<TimerIcon aria-hidden="true" />}
      />
      <KpiCard
        label="Publish"
        value={fmtRate(channel.publishRate)}
        detail="Messages in per second"
        icon={<MessageSquareIcon aria-hidden="true" />}
      />
      <KpiCard
        label="Deliver"
        value={fmtRate(channel.deliverRate)}
        detail="Messages out per second"
        tone="success"
        icon={<SendIcon aria-hidden="true" />}
      />
    </KpiGrid>
  );
}
