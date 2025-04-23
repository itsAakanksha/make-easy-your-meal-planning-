import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface NutritionChartProps {
  nutrients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
}

export function NutritionChart({ nutrients }: NutritionChartProps) {
  const data = nutrients.map(nutrient => ({
    name: nutrient.name,
    value: nutrient.amount,
    unit: nutrient.unit
  }));

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle>Nutritional Information</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background p-2 rounded-lg shadow border">
                      <p className="font-medium">{data.name}</p>
                      <p>{`${data.value} ${data.unit}`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
