import React from 'react'
import { Button } from '@/packages/components/ui/button'
import { Card, CardContent } from '@/packages/components/ui/card'

type Props = {
    productId: string
    productName?: string
    status: string
}

export default function CurrentPlan({ productId, productName, status }: Props) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <div className="text-sm text-muted-foreground">Current plan</div>
                    <div className="font-semibold">{productName || productId}</div>
                </div>
                <div className="text-sm text-muted-foreground">{status}</div>
                <div>
                    <Button asChild>
                        <a href="/api/payments/portal">Manage billing</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
