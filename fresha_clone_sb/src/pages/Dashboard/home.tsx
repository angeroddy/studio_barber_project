import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";


import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";

import TodayRdv from "../../components/custom/todayRdv";
import HistoryRdv from "../../components/custom/historyRdv";
import ClassementCoif from "../../components/ecommerce/classementCoif";

export default function Home() {
    return (
        <>
            <PageMeta
                title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
                description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
            />
            <div className="grid grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 space-y-6">
                    <EcommerceMetrics />
                </div>

                <div className="col-span-12 xl:col-span-6">

                    <HistoryRdv />
                </div>

                <div className="col-span-12 xl:col-span-6">

                    <TodayRdv />
                </div>

                <div className="col-span-12 xl:col-span-6">
                    <RecentOrders />
                </div>

                <div className="col-span-12 xl:col-span-6">
                    <ClassementCoif />
                </div>
            </div>
        </>
    );
}
