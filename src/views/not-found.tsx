import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { RegionEmpty } from "@/components/region-states";

export function NotFoundView({
  title = "Page not found",
  description = "The page you asked for does not exist in this cluster.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader title="Not found" description="Unknown management route." />
      <Card>
        <CardContent>
          <RegionEmpty
            title={title}
            description={description}
            icon={<SearchXIcon />}
            action={
              <Button nativeButton={false} render={<a href="#/overview" />}>
                <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                Back to overview
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
