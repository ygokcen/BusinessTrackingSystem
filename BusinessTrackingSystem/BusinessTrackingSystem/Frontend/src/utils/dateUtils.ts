import dayjs from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

export const formatDate = (date: string) => {
    return dayjs(date).format('DD MMM YYYY');
}; 