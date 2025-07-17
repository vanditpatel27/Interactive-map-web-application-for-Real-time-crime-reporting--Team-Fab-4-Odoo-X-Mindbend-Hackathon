import { INotificationSubscription } from '@/types';
import { Model, model, models, Schema } from 'mongoose';

const NotificationSubscriptionSchema = new Schema<INotificationSubscription>({
    userId: { type: String, required: true },
    subscription: { type: Object, required: true },
    createdAt: { type: Date, default: Date.now },
});

const NotificationSubscription = models?.notification_subscription as Model<INotificationSubscription> || model('notification_subscription', NotificationSubscriptionSchema);

export default NotificationSubscription;