import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface TestResponse {
  success: boolean;
  test?: {
    amount: number;
    subscriptionType: string;
    pointsMultiplier: number;
    expectedAward: number;
  };
  points?: {
    before: number;
    after: number;
    difference: number;
  };
  verified?: boolean;
  message?: string;
  error?: string;
}

export default function TestPointsPage() {
  const { toast } = useToast();
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async (amount: number, subscriptionType: string) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/points/test/award", {
        amount,
        subscriptionType,
      });
      const data = await res.json();
      setResponse(data);
      
      if (data.success) {
        toast({
          title: "Test Successful",
          description: `Awarded ${data.points?.difference} points`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.message || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test error:", error);
      toast({
        title: "Test Error",
        description: "Failed to run points test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader title="Points System Test" description="Verify points award functionality" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Subscription</CardTitle>
            <CardDescription>5 points per gallon</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest(10, "BASIC")} 
              className="w-full" 
              disabled={loading}
            >
              Award 10 Gallons
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Premium Subscription</CardTitle>
            <CardDescription>10 points per gallon</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest(10, "PREMIUM")} 
              className="w-full" 
              disabled={loading}
            >
              Award 10 Gallons
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unlimited Subscription</CardTitle>
            <CardDescription>20 points per gallon</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => runTest(10, "UNLIMITED")} 
              className="w-full" 
              disabled={loading}
            >
              Award 10 Gallons
            </Button>
          </CardContent>
        </Card>
      </div>

      {response && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <pre className="whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
            </div>
            {response.success && response.verified && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                ✅ Test passed! Points awarded correctly.
              </div>
            )}
            {response.success && !response.verified && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                ⚠️ Test completed but point values don't match expected values.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}