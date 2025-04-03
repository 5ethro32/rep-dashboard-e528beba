import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Calendar, ChartBar, CircleDollarSign, Info, TrendingDown, TrendingUp } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import LineChart from '@/components/LineChart';
import ProgressBar from '@/components/ProgressBar';
import DonutChart from '@/components/DonutChart';
import ActionItem from '@/components/ActionItem';
const turnoverData = [{
  name: 'Mar',
  value: 2100,
  avg: 2200
}, {
  name: 'Apr',
  value: 2250,
  avg: 2200
}, {
  name: 'May',
  value: 2400,
  avg: 2200
}, {
  name: 'Jun',
  value: 2300,
  avg: 2200
}, {
  name: 'Jul',
  value: 1900,
  avg: 2200
}, {
  name: 'Aug',
  value: 2100,
  avg: 2200
}, {
  name: 'Sep',
  value: 2500,
  avg: 2200
}, {
  name: 'Oct',
  value: 2400,
  avg: 2200
}, {
  name: 'Nov',
  value: 2250,
  avg: 2200
}, {
  name: 'Dec',
  value: 2146,
  avg: 2200
}];
const costOfSalesData = [{
  name: 'Mar',
  value: 1650,
  avg: 1800
}, {
  name: 'Apr',
  value: 1700,
  avg: 1800
}, {
  name: 'May',
  value: 1850,
  avg: 1800
}, {
  name: 'Jun',
  value: 1800,
  avg: 1800
}, {
  name: 'Jul',
  value: 1500,
  avg: 1800
}, {
  name: 'Aug',
  value: 1650,
  avg: 1800
}, {
  name: 'Sep',
  value: 1900,
  avg: 1800
}, {
  name: 'Oct',
  value: 1850,
  avg: 1800
}, {
  name: 'Nov',
  value: 1750,
  avg: 1800
}, {
  name: 'Dec',
  value: 1750,
  avg: 1800
}];
const grossProfitData = [{
  name: 'Mar',
  value: 350,
  avg: 360
}, {
  name: 'Apr',
  value: 330,
  avg: 360
}, {
  name: 'May',
  value: 380,
  avg: 360
}, {
  name: 'Jun',
  value: 400,
  avg: 360
}, {
  name: 'Jul',
  value: 370,
  avg: 360
}, {
  name: 'Aug',
  value: 360,
  avg: 360
}, {
  name: 'Sep',
  value: 420,
  avg: 360
}, {
  name: 'Oct',
  value: 450,
  avg: 360
}, {
  name: 'Nov',
  value: 360,
  avg: 360
}, {
  name: 'Dec',
  value: 390,
  avg: 360
}];
const operatingExpensesData = [{
  name: 'Jun',
  value: 342,
  avg: 312
}, {
  name: 'Jul',
  value: 332,
  avg: 312
}, {
  name: 'Aug',
  value: 336,
  avg: 312
}, {
  name: 'Sep',
  value: 320,
  avg: 312
}, {
  name: 'Oct',
  value: 318,
  avg: 312
}, {
  name: 'Nov',
  value: 295,
  avg: 312
}, {
  name: 'Dec',
  value: 319,
  avg: 312
}, {
  name: 'Jan',
  value: 310,
  avg: 312
}, {
  name: 'Feb',
  value: 292,
  avg: 312
}, {
  name: 'Mar',
  value: 285,
  avg: 312
}, {
  name: 'Apr',
  value: 290,
  avg: 312
}, {
  name: 'May',
  value: 288,
  avg: 312
}, {
  name: 'Jun',
  value: 290,
  avg: 312
}];
const expensesChartData = [{
  name: 'Wages',
  value: 68.5,
  color: '#ea384c'
}, {
  name: 'Bank',
  value: 9.1,
  color: '#4c4c4c'
}, {
  name: 'Fees',
  value: 2.2,
  color: '#5c5c5c'
}, {
  name: 'IT',
  value: 5.4,
  color: '#6c6c6c'
}, {
  name: 'Motor',
  value: 3.2,
  color: '#7c7c7c'
}, {
  name: 'Other',
  value: 8.8,
  color: '#8c8c8c'
}];
const wagesData = [{
  name: 'Jun',
  value: 215,
  avg: 210
}, {
  name: 'Jul',
  value: 214,
  avg: 210
}, {
  name: 'Aug',
  value: 213,
  avg: 210
}, {
  name: 'Sep',
  value: 208,
  avg: 210
}, {
  name: 'Oct',
  value: 205,
  avg: 210
}, {
  name: 'Nov',
  value: 204,
  avg: 210
}, {
  name: 'Dec',
  value: 217,
  avg: 210
}, {
  name: 'Jan',
  value: 204,
  avg: 210
}, {
  name: 'Feb',
  value: 200,
  avg: 210
}, {
  name: 'Mar',
  value: 198,
  avg: 210
}, {
  name: 'Apr',
  value: 197,
  avg: 210
}, {
  name: 'May',
  value: 204,
  avg: 210
}, {
  name: 'Jun',
  value: 205,
  avg: 210
}];
const Index = () => {
  const currentDate = "March 2025";
  return <div className="min-h-screen bg-finance-darkBg text-white">
      <header className="py-16 px-6 md:px-12 container max-w-7xl mx-auto animate-fade-in bg-gray-950">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold">
          Monthly
          <br />
          Fin<span className="font-normal italic">a</span>nce
          <br />
          <span className="text-finance-red">Report</span>
        </h1>
        <div className="mt-8 text-right">
          <span className="text-xl md:text-2xl">{currentDate}</span>
        </div>
      </header>

      <div className="container max-w-7xl mx-auto px-6 md:px-12 pb-16 bg-gray-950">
        <section className="mb-20 animate-slide-in-up">
          <h2 className="section-title mb-8">Executive Summary</h2>
          
          <div className="space-y-4 mb-10 w-full">
            <p className="text-sm md:text-base max-w-full text-finance-gray leading-relaxed">
              In December, Gross Profit grew by 8%, due to cost of sales declining at a faster rate than falling revenues. 
              This was mainly driven by reduced purchasing and a higher closing stock position than opening stock.
              However, Operating Expenses also rose to £319k, up from £298k.
            </p>
            
            <p className="text-sm md:text-base max-w-full text-finance-gray leading-relaxed">
              EBITDA improved to £490k, showing a £100k positive contribution in month though it still remains below target year-to-date.
            </p>
            
            <p className="text-sm md:text-base max-w-full text-finance-gray leading-relaxed">
              Persistent negative cash flow and underperforming EBITDA highlight the critical need to enhance working capital management and drive greater operational efficiencies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
            <MetricCard title="GROSS PROFIT INCREASED" value="£390k" change={{
            value: "from £360k (+8%)",
            type: "increase"
          }} />
            
            <MetricCard title="OPERATING EXPENSES INCREASED" value="£319k" change={{
            value: "from £298k",
            type: "increase"
          }} />
            
            <MetricCard title="POSITIVE EBITDA TREND" value="£490k" change={{
            value: "+£100k in-month",
            type: "increase"
          }} />
            
            <MetricCard title="NEGATIVE OPERATING CASHFLOW" value="-£589k" change={{
            value: "-£177k prior month",
            type: "decrease"
          }} valueClassName="text-finance-red" />
            
            <MetricCard title="INCREASED DEBT POSITION" value="£2.147m" change={{
            value: "+0.13% (£3k)",
            type: "increase"
          }} />
          </div>
        </section>
        
        <Separator className="bg-white/10 my-12" />
        
        <section className="mb-20 animate-slide-in-up">
          <h2 className="section-title mb-8">Profit & Loss</h2>
          
          <div className="space-y-4 mb-10 w-full">
            <p className="text-sm md:text-base text-finance-gray leading-relaxed">
              Turnover experienced a slight decrease, primarily driven by seasonal factors that reduced market activity. 
              This led to a notable decline in generic sales, although CDs continued to perform strongly.
            </p>
            
            <p className="text-sm md:text-base text-finance-gray leading-relaxed">
              The Cost of Sales decreased at an accelerated pace month-on-month, resulting in an improvement in Gross Profit.
              The reduction is attributed to a higher closing stock position and a strategic decrease in
              purchasing from manufacturers, reflecting a deliberate effort to minimise buying after achieving core rebate tiers.
            </p>
            
            <p className="text-sm md:text-base text-finance-gray leading-relaxed">
              Gross Profit is trending positively on a month-on-month basis and is exceeding the yearly average,
              demonstrating ongoing financial strength.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <h3 className="text-xl mb-4">Turnover</h3>
              <MetricCard title="" value="£2.146m" change={{
              value: "-3.7% MoM",
              type: "decrease"
            }} className="mb-4" />
              <div className="h-40">
                <LineChart data={turnoverData} />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl mb-4">Cost of Sales</h3>
              <MetricCard title="" value="£1.750m" change={{
              value: "-5.6% MoM",
              type: "decrease"
            }} className="mb-4" />
              <div className="h-40">
                <LineChart data={costOfSalesData} />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl mb-4">Gross Profit</h3>
              <MetricCard title="" value="£390k" change={{
              value: "+8.3% MoM",
              type: "increase"
            }} className="mb-4" />
              <div className="h-40">
                <LineChart data={grossProfitData} color="#4ade80" />
              </div>
            </div>
          </div>
        </section>
        
        <section className="mb-20 animate-slide-in-up">
          <h2 className="section-title mb-8">Operating Expenses</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="h-80">
              <LineChart data={operatingExpensesData} color="#fff" avgColor="#ea384c" />
            </div>
            
            <div className="h-80">
              <DonutChart data={expensesChartData} innerValue="£319k" innerLabel="7% MoM" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            <Card className="bg-transparent border-white/10 border">
              <CardContent className="p-4">
                <h4 className="text-sm text-finance-gray mb-2">Wages</h4>
                <div className="text-xl font-bold mb-1">£217k</div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUp className="mr-1 h-3 w-3" />6.4%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-white/10 border">
              <CardContent className="p-4">
                <h4 className="text-sm text-finance-gray mb-2">IT</h4>
                <div className="text-xl font-bold mb-1">£17.1k</div>
                <div className="flex items-center text-xs text-finance-red">
                  <ArrowDown className="mr-1 h-3 w-3" />0.6%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-white/10 border">
              <CardContent className="p-4">
                <h4 className="text-sm text-finance-gray mb-2">Professional Fees</h4>
                <div className="text-xl font-bold mb-1">£7.3k</div>
                <div className="flex items-center text-xs text-finance-red">
                  <ArrowDown className="mr-1 h-3 w-3" />56.3%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-white/10 border">
              <CardContent className="p-4">
                <h4 className="text-sm text-finance-gray mb-2">Motor Expenses</h4>
                <div className="text-xl font-bold mb-1">£13.6k</div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUp className="mr-1 h-3 w-3" />18.5%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-white/10 border">
              <CardContent className="p-4">
                <h4 className="text-sm text-finance-gray mb-2">Bank Charges</h4>
                <div className="text-xl font-bold mb-1">£29.1k</div>
                <div className="flex items-center text-xs text-green-500">
                  <ArrowUp className="mr-1 h-3 w-3" />181.9%
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-white/10 border">
              <CardContent className="p-4">
                <h4 className="text-sm text-finance-gray mb-2">Rent & Rates</h4>
                <div className="text-xl font-bold mb-1">£8.7k</div>
                <div className="flex items-center text-xs text-finance-red">
                  <ArrowDown className="mr-1 h-3 w-3" />0.8%
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="mb-20 animate-slide-in-up">
          <h2 className="section-title mb-8">Wages Analysis</h2>
          
          <div className="space-y-4 mb-10 w-full">
            <p className="text-sm md:text-base text-finance-gray leading-relaxed">
              December saw the gross wages increase substantially from the prior month (+6.4%), driven primarily from Christmas bonuses.
              c.£5k gross reduction expected over next 6 months, before an increase from budget changes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="space-y-6">
              <MetricCard title="November Total Gross Wages" value="£216,836" change={{
              value: "+6.4% MoM",
              type: "increase"
            }} className="mb-6" />
              
              <ul className="list-disc pl-6 space-y-2 text-finance-gray text-sm">
                <li>Estimated £204k gross in January (-6.0%).</li>
                <li>c.£12k decrease in January due to no bonuses.</li>
                <li>Steady continued reduction MoM thereafter.
                  <ul className="list-disc pl-6 mt-1">
                    <li>2 FTE reduction by March 2025</li>
                  </ul>
                </li>
                <li>c.£5k increase in April due to NI and Living Wage increase.</li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl mb-4">Breakdown and Forecast</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <MetricCard title="Net Wages" value="£148,225" change={{
                value: "+4.2% MoM",
                type: "increase"
              }} className="mb-2" />
                
                <MetricCard title="PAYE Tax" value="£30,938" change={{
                value: "+16.3% MoM",
                type: "increase"
              }} className="mb-2" />
                
                <MetricCard title="NI" value="£29,033" change={{
                value: "+9.1% MoM",
                type: "increase"
              }} className="mb-2" />
                
                <MetricCard title="Pension" value="£8,509" change={{
                value: "+2.7% MoM",
                type: "increase"
              }} className="mb-2" />
              </div>
              
              <div className="h-60 mt-6">
                <LineChart data={wagesData} />
              </div>
            </div>
          </div>
        </section>
        
        <section className="mb-20 animate-slide-in-up">
          <h2 className="section-title mb-8">EBITDA Tracker</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl mb-6">Individual Performance and Targets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-finance-darkSecondary border-white/10 border">
                  <CardContent className="p-6 bg-slate-950">
                    <h4 className="text-lg mb-2">Aver</h4>
                    <div className="text-sm text-finance-gray">Current EBITDA</div>
                    <div className="text-3xl font-bold mb-1">£490k</div>
                    <div className="flex items-center text-xs text-green-500 mb-4">
                      <ArrowUp className="mr-1 h-3 w-3" />£100k MoM
                    </div>
                    
                    <div className="text-sm text-finance-gray">Target</div>
                    <div className="text-3xl font-bold mb-2">£835k</div>
                    
                    <ProgressBar value={490} max={835} showPercentage={true} />
                  </CardContent>
                </Card>
                
                <Card className="bg-finance-darkSecondary border-white/10 border">
                  <CardContent className="p-6 bg-gray-950">
                    <h4 className="text-lg mb-2">Howard (WHC)</h4>
                    <div className="text-sm text-finance-gray">Current EBITDA</div>
                    <div className="text-3xl font-bold mb-1">£104k</div>
                    <div className="flex items-center text-xs text-green-500 mb-4">
                      <ArrowUp className="mr-1 h-3 w-3" />£31k MoM
                    </div>
                    
                    <div className="text-sm text-finance-gray">Target</div>
                    <div className="text-3xl font-bold mb-2">£180k</div>
                    
                    <ProgressBar value={104} max={180} showPercentage={true} />
                  </CardContent>
                </Card>
                
                <Card className="bg-finance-darkSecondary border-white/10 border">
                  <CardContent className="p-6 bg-gray-950">
                    <h4 className="text-lg mb-2">Howard (LPP)</h4>
                    <div className="text-sm text-finance-gray">Current EBITDA</div>
                    <div className="text-3xl font-bold mb-1">£257k</div>
                    <div className="flex items-center text-xs text-green-500 mb-4">
                      <ArrowUp className="mr-1 h-3 w-3" />£23k MoM
                    </div>
                    
                    <div className="text-sm text-finance-gray">Target</div>
                    <div className="text-3xl font-bold mb-2">£300k</div>
                    
                    <ProgressBar value={257} max={300} showPercentage={true} />
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl mb-6">Combined EBITDA To Target</h3>
              
              <Card className="bg-finance-darkSecondary border-white/10 border h-80">
                <CardContent className="p-6 h-full bg-gray-950">
                  <div className="flex flex-col h-full">
                    <div>
                      <div className="text-sm text-finance-gray">Current EBITDA</div>
                      <div className="text-3xl font-bold mb-6">£719k</div>
                      
                      <div className="text-sm text-finance-gray">Target</div>
                      <div className="text-3xl font-bold mb-4">£1.315m</div>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center">
                      <div className="h-48 w-48">
                        <DonutChart data={[{
                        name: 'Progress',
                        value: 55,
                        color: '#ea384c'
                      }, {
                        name: 'Remaining',
                        value: 45,
                        color: '#ffffff'
                      }]} innerValue="55%" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        <section className="animate-slide-in-up">
          <h2 className="section-title mb-8">Actions & Next Steps</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl mb-6">High Level Overview - So What?</h3>
              
              <div className="space-y-8">
                <ActionItem icon="up">
                  <p className="text-base text-finance-gray">Net Profit and EBITDA are positive, though down from prior year.</p>
                </ActionItem>
                
                <ActionItem icon="down">
                  <p className="text-base text-finance-gray">EBITDA currently falling short of covenant target.</p>
                </ActionItem>
                
                <ActionItem icon="down">
                  <p className="text-base text-finance-gray">Costs trending downward, but more progress is needed to reach desired levels.</p>
                </ActionItem>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl mb-6">Strategic Recommendations</h3>
              
              <div className="space-y-8">
                <ActionItem icon="right">
                  <div>
                    <p className="text-base font-semibold mb-2">Proposed £200k reduction of external debt:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-finance-gray">
                      <li>Covenant lowered to £1.115m</li>
                      <li>c. £15k of interest savings</li>
                      <li>Strong progress in reducing outstanding debt</li>
                    </ul>
                  </div>
                </ActionItem>
                
                <ActionItem icon="right">
                  <div>
                    <p className="text-base font-semibold mb-2">5% reduction in Operating Expenditure:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-finance-gray">
                      <li>Review and eliminate discretionary spending to target £280k pcm</li>
                      <li>Focus on inefficiencies (e.g. warehouse)</li>
                    </ul>
                  </div>
                </ActionItem>
                
                <ActionItem icon="right">
                  <div>
                    <p className="text-base font-semibold mb-2">Payroll Expense:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-finance-gray">
                      <li>Reduce costs in anticipation of increases in April 25</li>
                    </ul>
                  </div>
                </ActionItem>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <footer className="py-6 border-t border-white/10">
        <div className="container max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center">
            <div className="text-sm text-finance-gray">Monthly Finance Report</div>
            <div className="text-sm text-finance-gray">December 2024</div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;